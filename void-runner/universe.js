/* Stable location IDs and route policy shared by campaign, saves and HUD. */
(function(root){
 const progression=typeof module!=='undefined'?require('./progression.js'):root.VoidProgression;
 const systems={erebus:{name:'Erebus System',hub:'meridian',ownerFaction:null,securityFaction:'erebus-local',populationPool:[],shopPool:[],missionPool:[]},sol:{name:'Tessaly System',hub:'sol-belt',ownerFaction:null,securityFaction:'sol-local',populationPool:[],shopPool:[],missionPool:[]},
  // Faction territory. Each system opens when the player accepts its District delivery.
  communion:{name:'Cantor System',hub:'vigil',ownerFaction:'communion',securityFaction:'communion',populationPool:[],shopPool:[],missionPool:[]},'natural-order':{name:'Garrow System',hub:'holdfast',ownerFaction:'natural-order',securityFaction:'natural-order',populationPool:[],shopPool:[],missionPool:[]}};
 const locations={
  vesper:{system:'erebus',name:'Vesper',district:'WARD FREIGHT WORKSHOP',color:'#c2a584',bar:'Workshop'},
  meridian:{system:'erebus'},kepler:{system:'erebus'},rusthaven:{system:'erebus'},foundry:{system:'erebus'},
  'sol-belt':{system:'sol',name:'Tessaly Belt Anchorage',district:'TESSALY / ASTEROID BELT',color:'#8dbea9',bar:'Belt Canteen'},
  earth:{system:'sol',name:'NeoChinatown',district:'TESSALY / CITY LANDING',color:'#9b7bff',bar:'The Darknet District'},
  mars:{system:'sol',name:'Vantor / Underground City',district:'TESSALY / SUBSURFACE ACCESS',color:'#ba6847',bar:'Transit Canteen'},
  vigil:{system:'communion',name:'The Vigil',district:'CANTOR / COMMUNION STATION',color:'#9fd2ec',bar:'Refectory',ownerFaction:'communion',securityFaction:'communion'},
  holdfast:{system:'natural-order',name:'Holdfast',district:'GARROW / NATURAL ORDER OUTPOST',color:'#d08a3c',bar:'Mess Hall',ownerFaction:'natural-order',securityFaction:'natural-order'},
  // Faction homeworlds (doc 10): open when the homeworld offer is accepted. The Natural Order world has no name yet.
  nexus:{system:'communion',name:'The Nexus',district:'CANTOR / COMMUNION HOMEWORLD',color:'#8fd4ee',bar:'Aid Station',ownerFaction:'communion',securityFaction:'communion',planet:true},
  'order-homeworld':{system:'natural-order',name:'Natural Order Homeworld',district:'GARROW / NATURAL ORDER HOMEWORLD (NAME PENDING)',color:'#c9a24a',bar:'Cooperative Hall',ownerFaction:'natural-order',securityFaction:'natural-order',planet:true}
 };
 for(const location of Object.values(locations)){location.ownerFaction??=null;location.securityFaction??=location.system==='sol'?'sol-local':'erebus-local';}
 function system(id){return locations[id]?.system||'erebus';}
 function route(a,b){const interstellar=system(a)!==system(b);return {kind:interstellar?'interstellar':'local',seconds:progression.tuning.jump[interstellar?'interstellar':'local'],interdiction:!interstellar};}
 function fresh(){return {currentSystem:'erebus',discoveredSystems:['erebus'],discoveredLocations:['vesper','meridian'],visitedLocations:['vesper'],missionLogUnlocked:false,freeTravel:false,trackedMission:null,trackingInitialized:false,autoTrack:true,missions:{},completedObjectives:[],station:null};}
 function restore(raw={},state={}){const out={...fresh()},valid=xs=>Array.isArray(xs)?[...new Set(xs.filter(x=>Object.hasOwn(locations,x)))]:[];
  out.currentSystem=system(state.location);out.discoveredLocations=[...new Set([...out.discoveredLocations,...valid(raw.discoveredLocations),state.location].filter(Boolean))];out.visitedLocations=[...new Set([...out.visitedLocations,...valid(raw.visitedLocations),state.location].filter(Boolean))];
  // Earlier saves already received Rook's voucher; migrate its world unlock once.
  out.missionLogUnlocked=raw.missionLogUnlocked===true||state.progression?.opening?.pistol===true||state.missileOfferSeen===true||state.quest!=='inheritance';out.freeTravel=state.progression?state.progression.completed===true||raw.freeTravel===true:out.missionLogUnlocked;
  out.trackedMission=typeof raw.trackedMission==='string'?raw.trackedMission:null;
  out.trackingInitialized=raw.trackingInitialized===true||out.trackedMission!==null;
  // Only an explicit Untrack turns off automatic tracking of the next mission.
  out.autoTrack=raw.autoTrack!==false;
  for(const [id,entry] of Object.entries(raw.missions||{}).slice(0,100))if(/^[a-z][a-z0-9-]{0,79}$/.test(id)&&entry?.acquired===true){
   const objectives={};for(const [key,value] of Object.entries(entry.objectives||{}).slice(0,100))if(/^[a-z][a-z0-9-]{0,79}$/.test(key)&&value===true)objectives[key]=true;
   out.missions[id]={acquired:true,completed:entry.completed===true,objectives};
  }
  out.completedObjectives=Array.isArray(raw.completedObjectives)?raw.completedObjectives.filter(x=>typeof x==='string'&&x.length<80).slice(0,200):[];
  if(state.quest==='open')out.discoveredLocations=[...new Set([...out.discoveredLocations,'kepler','rusthaven','foundry'])];
  if(out.freeTravel)out.discoveredLocations=[...new Set([...out.discoveredLocations,'sol-belt','earth','mars'])];
  // Known systems follow known locations, so a newly opened faction system survives a reload.
  out.discoveredSystems=[...new Set(['erebus',...(out.freeTravel?['sol']:[]),...out.discoveredLocations.map(system)])];
  if(raw.station?.location===state.location)out.station={location:state.location};return out;
 }
 function unlock(s){const travel=s.progression?.completed===true||s.progression?.flags?.missileFired===true||s.universe?.freeTravel===true;s.universe=restore({...s.universe,missionLogUnlocked:true,freeTravel:travel},s);if(travel&&!s.universe.trackingInitialized&&!s.universe.trackedMission)s.universe.trackedMission='meet-admin';}
 function visit(s){const u=s.universe;u.currentSystem=system(s.location);for(const key of ['visitedLocations','discoveredLocations'])if(!u[key].includes(s.location))u[key].push(s.location);if(!u.discoveredSystems.includes(u.currentSystem))u.discoveredSystems.push(u.currentSystem);u.station={location:s.location};}
 function discover(s,id){const u=s.universe;if(!Object.hasOwn(locations,id))return false;if(!u.discoveredLocations.includes(id))u.discoveredLocations.push(id);if(!u.discoveredSystems.includes(system(id)))u.discoveredSystems.push(system(id));return true;}
 function destinations(s){const u=s.universe||fresh();return u.discoveredLocations.filter(id=>id!==s.location&&(system(id)===system(s.location)||id===systems[system(id)].hub));}
 function nextHop(origin,target){return system(origin)===system(target)?target:systems[system(target)].hub;}
 const api={systems,locations,system,route,fresh,restore,unlock,visit,discover,destinations,nextHop};if(typeof module!=='undefined')module.exports=api;else root.VoidUniverse=api;
})(globalThis);
